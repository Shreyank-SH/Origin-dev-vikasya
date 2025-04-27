import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, MessageSquare } from "lucide-react";
import { CreateGroupModal } from "@/components/modals/CreateGroupModal";

const Groups = () => {
  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-sage-800">Groups</h1>
            <CreateGroupModal />
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((group) => (
              <div
                key={group}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-sage-200" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">Group Name</h3>
                  <p className="text-sage-600 text-sm mb-4">
                    A brief description of the group's purpose and activities.
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-sage-500">
                      <Users className="h-4 w-4" />
                      <span>128 members</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-sage-500">
                      <MessageSquare className="h-4 w-4" />
                      <span>24 posts</span>
                    </div>
                  </div>
                  <Button className="w-full bg-sage-600 hover:bg-sage-700">
                    Join Group
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Groups;