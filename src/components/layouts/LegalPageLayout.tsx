import { ReactNode } from "react";
import PageLayout from "./PageLayout";
import Breadcrumbs from "@/components/Breadcrumbs";

interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated: string;
  breadcrumbs: Array<{ label: string; href: string }>;
}

const LegalPageLayout = ({ children, title, lastUpdated, breadcrumbs }: LegalPageLayoutProps) => {
  return (
    <PageLayout>
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-2">{title}</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          {children}
        </div>
      </div>
    </PageLayout>
  );
};

export default LegalPageLayout;
