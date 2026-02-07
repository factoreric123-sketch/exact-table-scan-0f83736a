import { blogArticles } from "@/data/blogArticles";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layouts/PageLayout";

const Blog = () => {
  const featuredArticle = blogArticles[0];
  const otherArticles = blogArticles.slice(1);

  return (
    <PageLayout>
      {/* Hero Section - matching legal pages style */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted/20 border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 max-w-4xl py-16 md:py-24 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Insights & Updates
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Our Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Tips, insights, and updates from the world of restaurant technology
          </p>
        </div>
      </div>

      {/* Featured Article */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to={`/blog/${featuredArticle.slug}`} className="group block">
            <div className="rounded-2xl border border-border/50 bg-card/5 overflow-hidden hover:border-border transition-colors">
              <div className="p-8 md:p-10 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    {featuredArticle.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Featured</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
                  {featuredArticle.excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {featuredArticle.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {featuredArticle.readTime}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Article Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold mb-8 pb-3 border-b border-border/30">Recent Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherArticles.map((article) => (
              <Link key={article.slug} to={`/blog/${article.slug}`} className="group">
                <div className="h-full rounded-xl border border-border/30 bg-card/5 p-6 hover:border-border transition-colors space-y-4">
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                    {article.category}
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;
