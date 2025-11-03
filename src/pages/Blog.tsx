import PageLayout from "@/components/layouts/PageLayout";
import BlogCard from "@/components/blog/BlogCard";
import { blogArticles } from "@/data/blogArticles";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Blog = () => {
  const featuredArticle = blogArticles[0];
  const otherArticles = blogArticles.slice(1);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            TapMenu Blog
          </h1>
          <p className="text-xl text-muted-foreground">
            Tips, insights, and updates from the world of restaurant technology
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
          <Link to={`/blog/${featuredArticle.slug}`}>
            <div className="grid lg:grid-cols-2 gap-8 bg-card rounded-lg overflow-hidden hover:shadow-xl transition-shadow border">
              <div className="aspect-video lg:aspect-auto overflow-hidden">
                <img 
                  src={featuredArticle.image} 
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="inline-block w-fit bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
                  {featuredArticle.category}
                </div>
                <h3 className="text-3xl font-bold mb-4">{featuredArticle.title}</h3>
                <p className="text-muted-foreground mb-6">{featuredArticle.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{featuredArticle.date}</span>
                  <span>•</span>
                  <span>{featuredArticle.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article) => (
              <BlogCard key={article.slug} {...article} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Menu?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of restaurants using TapMenu to create beautiful digital menus.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth?signup=true">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;
