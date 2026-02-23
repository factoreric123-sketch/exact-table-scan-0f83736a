import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MapPin, Briefcase } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface JobCardProps {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}

const JobCard = ({ title, department, location, type, description, responsibilities, requirements }: JobCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="text-left">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {location}
                  </span>
                  <span>{type}</span>
                </CardDescription>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 text-left">
            <p className="text-black">{description}</p>
            <div>
              <h4 className="font-semibold mb-3">Responsibilities</h4>
              <ul className="space-y-2 list-disc list-inside">
                {responsibilities.map((item, index) => (
                  <li key={index} className="text-black">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Requirements</h4>
              <ul className="space-y-2 list-disc list-inside">
                {requirements.map((item, index) => (
                  <li key={index} className="text-black">{item}</li>
                ))}
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link to={`/careers/apply?position=${encodeURIComponent(title)}`}>Apply Now</Link>
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default JobCard;
