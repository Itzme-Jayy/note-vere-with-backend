
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, Users } from "lucide-react";
import Layout from "@/components/Layout";

const Home = () => {
  return (
    <Layout>
      <div className="space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to NoteVerse
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share and discover academic notes with students from your college. Organize by branch, year, and subject.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link to="/explore">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Explore Notes
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2">
                <FileText className="h-5 w-5" />
                Share Your Notes
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          <div className="bg-accent p-6 rounded-lg text-center space-y-3">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Share Your Notes</h3>
            <p className="text-muted-foreground">
              Upload your study materials, from class notes to assignment solutions
            </p>
          </div>
          <div className="bg-accent p-6 rounded-lg text-center space-y-3">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Find Quality Content</h3>
            <p className="text-muted-foreground">
              Discover comprehensive notes categorized by branch, year, and subject
            </p>
          </div>
          <div className="bg-accent p-6 rounded-lg text-center space-y-3">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Build Your Network</h3>
            <p className="text-muted-foreground">
              Connect with fellow students and learn from their shared knowledge
            </p>
          </div>
        </section>

        <section className="bg-muted/30 p-8 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ready to start sharing?</h2>
              <p className="text-muted-foreground">
                Create an account today and begin sharing your academic knowledge with others.
              </p>
            </div>
            <Link to="/register">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
