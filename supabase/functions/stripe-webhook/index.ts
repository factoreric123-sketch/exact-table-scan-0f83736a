import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('Webhook event received:', event.type);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.subscription_data?.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log('Checkout completed. Customer:', customerId, 'Subscription:', subscriptionId);

        if (subscriptionId && customerId) {
          // Fetch subscription details from Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Find user by customer ID if no userId in metadata
          let targetUserId = userId;
          if (!targetUserId) {
            const { data: sub } = await supabaseClient
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();
            targetUserId = sub?.user_id;
          }

          if (targetUserId) {
            await supabaseClient
              .from('subscriptions')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: stripeSubscription.status === 'trialing' ? 'active' : stripeSubscription.status,
                plan_type: 'premium',
                current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', targetUserId);
            console.log('Subscription activated for user:', targetUserId);
          } else {
            console.error('Could not find user for customer:', customerId);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        // Also try finding user by customer ID
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: sub } = await supabaseClient
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();
          targetUserId = sub?.user_id;
        }

        if (!targetUserId) {
          console.error('No userId found for subscription:', subscription.id);
          break;
        }

        console.log('Updating subscription for user:', targetUserId);

        await supabaseClient
          .from('subscriptions')
          .update({
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status === 'trialing' ? 'active' : subscription.status,
            plan_type: 'premium',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId);

        console.log('Subscription updated successfully');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription deleted:', subscription.id);

        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription downgraded to free');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          console.log('Payment succeeded for subscription:', invoice.subscription);
          
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          console.log('Payment failed for subscription:', invoice.subscription);
          
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
