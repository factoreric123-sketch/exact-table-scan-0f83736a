-- Update ericfactor09@gmail.com to premium
UPDATE subscriptions 
SET plan_type = 'premium', status = 'active', updated_at = now()
WHERE user_id = '9d195c85-20f2-4da8-b842-7b1c7df3faba';

-- Insert or update factoreric123@gmail.com to premium
INSERT INTO subscriptions (user_id, plan_type, status)
VALUES ('85b9126f-4e32-4b3e-9740-b7fb79ed31c3', 'premium', 'active')
ON CONFLICT (user_id) DO UPDATE 
SET plan_type = 'premium', status = 'active', updated_at = now();