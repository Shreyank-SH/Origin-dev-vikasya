import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Plus } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export function CreateGroupModal() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async () => {
    if (!name || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No authenticated user")

      let bannerUrl = null
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop()
        const filePath = `${crypto.randomUUID()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, bannerFile)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath)
        
        bannerUrl = publicUrl
      }

      const { error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          creator_id: user.id,
          banner_url: bannerUrl,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Club created successfully",
      })

      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setName("")
      setDescription("")
      setCategory("")
      setBannerFile(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0])
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-sage-600 hover:bg-sage-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Club</DialogTitle>
          <DialogDescription>
            Create a club to connect with others who share your interests.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Club Name</Label>
            <Input 
              id="group-name" 
              placeholder="Enter club name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Club Banner</Label>
            <div 
              className="border-2 border-dashed border-sage-200 rounded-lg p-4 text-center cursor-pointer"
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-sage-500" />
              <p className="text-sm text-sage-600">
                {bannerFile ? bannerFile.name : "Drag & drop or click to upload"}
              </p>
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              placeholder="Describe your club..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-category">Category</Label>
            <Input 
              id="group-category" 
              placeholder="e.g., Technology, Research" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isLoading}>Cancel</Button>
          <Button 
            className="bg-sage-600 hover:bg-sage-700"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}