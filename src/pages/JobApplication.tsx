import PageLayout from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useRef } from "react";
import { toast } from "sonner";

const JobApplication = () => {
  const [searchParams] = useSearchParams();
  const position = searchParams.get("position") || "General Application";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedIn: "",
    coverLetter: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File must be under 5MB");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (isSubmitted) {
    return (
      <PageLayout>
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-foreground mx-auto" />
            <h1 className="text-3xl md:text-4xl font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for applying for <strong className="text-foreground">{position}</strong>. We'll review your application and get back to you within 5-7 business days.
            </p>
            <Button asChild variant="outline">
              <Link to="/careers">← Back to Careers</Link>
            </Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/careers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Careers
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply for Position</h1>
          <p className="text-lg text-muted-foreground mb-8">{position}</p>

          <Card className="bg-foreground text-background">
            <CardHeader>
              <CardTitle className="text-background">Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-background/80">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-background/80">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-background/80">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-background/80">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label htmlFor="linkedIn" className="text-background/80">LinkedIn Profile</Label>
                  <Input
                    id="linkedIn"
                    name="linkedIn"
                    value={formData.linkedIn}
                    onChange={handleChange}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label className="text-background/80">Resume / CV</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-background/30 rounded-lg p-6 text-center cursor-pointer hover:border-background/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-background/50" />
                    {resumeFile ? (
                      <p className="text-sm text-background">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-background/70">Click to upload your resume</p>
                        <p className="text-xs text-background/50 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <Label htmlFor="coverLetter" className="text-background/80">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows={6}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 resize-none"
                    placeholder="Tell us why you'd be a great fit for this role..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-background text-foreground hover:bg-background/90"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
};

export default JobApplication;
