import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { blogArticles } from "@/data/blogArticles";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const article = blogArticles.find(a => a.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <Link to="/blog">
              <Button variant="outline">Back to Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section - matching legal pages */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted/20 border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 max-w-4xl py-16 md:py-24 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
              {article.category}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
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

      {/* Content - using legal-content styling */}
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-4xl py-12 md:py-16">
          <div className="legal-content space-y-8">
            {article.content.split('\n\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith('## ')) {
                return (
                  <section key={index}>
                    <h2>{trimmed.substring(3)}</h2>
                  </section>
                );
              }
              return <p key={index}>{trimmed}</p>;
            })}
          </div>

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-border/30">
            <Link to="/blog">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
