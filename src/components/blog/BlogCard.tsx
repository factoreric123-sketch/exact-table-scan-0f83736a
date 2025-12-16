import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
}

const BlogCard = ({ slug, title, excerpt, category, date, readTime, image }: BlogCardProps) => {
  return (
    <Link to={`/blog/${slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-video overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardHeader>
          <Badge variant="secondary" className="w-fit mb-2">{category}</Badge>
          <CardTitle className="text-xl line-clamp-2">{title}</CardTitle>
          <CardDescription className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-black line-clamp-3">{excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogCard;
