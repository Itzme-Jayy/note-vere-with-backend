
import React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, FileText, LogOut, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  // Protected routes
  const protectedRoutes = ["/my-notes", "/create-note", "/edit-note"];
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected routes without authentication
  if (!isLoading && !user && isProtectedRoute) {
    return <Navigate to="/login" />;
  }

  const isActive = (path: string) => {
    return location.pathname === path ? "bg-accent text-accent-foreground" : "";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span>NoteVerse</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden md:block text-sm">
                  Welcome, {user.username}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button 
                  variant="secondary" 
                  size="sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto flex flex-col md:flex-row flex-1 p-4 gap-6">
        <nav className="w-full md:w-64 shrink-0">
          <div className="bg-card rounded-lg shadow-sm p-4 sticky top-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className={`flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-colors ${isActive("/")}`}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/explore" 
                  className={`flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-colors ${isActive("/explore")}`}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Explore Notes</span>
                </Link>
              </li>
              
              {user && (
                <>
                  <li>
                    <Link 
                      to="/my-notes" 
                      className={`flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-colors ${isActive("/my-notes")}`}
                    >
                      <FileText className="h-5 w-5" />
                      <span>My Notes</span>
                    </Link>
                  </li>
                  <li className="pt-2">
                    <Link to="/create-note">
                      <Button className="w-full">
                        Create Note
                      </Button>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
        
        <main className="flex-1 bg-card rounded-lg shadow-sm p-6">
          {children}
        </main>
      </div>
      
      <footer className="bg-muted py-4 mt-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} NoteVerse. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
