import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/layouts/PageLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { blogArticles } from "@/data/blogArticles";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = blogArticles.find(a => a.slug === slug);

  if (!article) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <Link to="/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Breadcrumbs items={[
            { label: "Blog", href: "/blog" },
            { label: article.title, href: `/blog/${article.slug}` }
          ]} />
          <div className="mt-8 ">
            <Badge variant="secondary" className="mb-4">{article.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{article.title}</h1>
            <div className="flex sm:items-center flex-col sm:flex-row gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {article.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
              <span>By {article.author}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={index}>{paragraph.substring(3)}</h2>;
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>
        </div>
      </article>

      {/* Back to Blog */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Create your digital menu in minutes. No credit card required.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth?signup=true">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default BlogPost;
