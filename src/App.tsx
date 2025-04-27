import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Events from "@/pages/Events";
import { EventDetails } from "@/components/events/EventDetails";
import LiveFeed from "@/pages/LiveFeed";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Opportunities from "@/pages/Opportunities";
import People from "@/pages/People";
import Clubs from "@/pages/Clubs";
import Portfolios from "@/pages/Portfolios";
import Profile from "@/pages/Profile";
import Tutorials from "@/pages/Tutorials";
import TutorialDetails from "@/pages/TutorialDetails";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { OpportunityDetails } from "@/components/opportunities/OpportunityDetails";
import AdminDashboard from "@/pages/AdminDashboard";
import ClubDetails from "@/pages/ClubDetails";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Navigate to="/feed" replace />
              </AuthGuard>
            }
          />

          <Route
            path="/feed"
            element={
              <AuthGuard>
                <LiveFeed />
              </AuthGuard>
            }
          />

          <Route
            path="/projects"
            element={
              <AuthGuard>
                <Projects />
              </AuthGuard>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <AuthGuard>
                <ProjectDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/opportunities"
            element={
              <AuthGuard>
                <Opportunities />
              </AuthGuard>
            }
          />
          <Route
            path="/opportunities/:id"
            element={
              <AuthGuard>
                <OpportunityDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/people"
            element={
              <AuthGuard>
                <People />
              </AuthGuard>
            }
          />
          <Route
            path="/events"
            element={
              <AuthGuard>
                <Events />
              </AuthGuard>
            }
          />
          <Route
            path="/events/:id"
            element={
              <AuthGuard>
                <EventDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/clubs"
            element={
              <AuthGuard>
                <Clubs />
              </AuthGuard>
            }
          />
          <Route
            path="/clubs/:id"
            element={
              <AuthGuard>
                <ClubDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/portfolios"
            element={
              <AuthGuard>
                <Portfolios />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/tutorials"
            element={
              <AuthGuard>
                <Tutorials />
              </AuthGuard>
            }
          />
          <Route
            path="/tutorials/:id"
            element={
              <AuthGuard>
                <TutorialDetails />
              </AuthGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
