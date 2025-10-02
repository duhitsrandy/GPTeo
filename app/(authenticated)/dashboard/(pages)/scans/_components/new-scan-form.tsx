"use client"

import { createScan } from "@/actions/scans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

export function NewScanForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [domain, setDomain] = useState("")
  const [urls, setUrls] = useState<string[]>([""])
  const [mode, setMode] = useState<"quick" | "standard" | "deep">("quick")

  const handleAddUrl = () => {
    setUrls([...urls, ""])
  }

  const handleRemoveUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out empty URLs
      const validUrls = urls.filter(url => url.trim() !== "")

      if (!domain.trim()) {
        toast.error("Please enter a domain")
        setIsSubmitting(false)
        return
      }

      if (validUrls.length === 0) {
        toast.error("Please enter at least one URL")
        setIsSubmitting(false)
        return
      }

      const result = await createScan({
        domain: domain.trim(),
        seedUrls: validUrls,
        mode
      })

      if (result.success) {
        toast.success("Scan created successfully!")
        // Reset form
        setDomain("")
        setUrls([""])
        setMode("quick")
        // Refresh the page to show new scan
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create scan")
      }
    } catch (error) {
      console.error("Error submitting scan:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Domain Input */}
      <div className="space-y-2">
        <Label htmlFor="domain">
          Domain <span className="text-destructive">*</span>
        </Label>
        <Input
          id="domain"
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          disabled={isSubmitting}
          className="max-w-xl"
        />
        <p className="text-muted-foreground text-xs">
          Enter the domain without http:// or www (e.g., example.com)
        </p>
      </div>

      {/* URLs Input */}
      <div className="space-y-2">
        <Label>
          URLs to Scan <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/product/item"
                value={url}
                onChange={e => handleUrlChange(index, e.target.value)}
                disabled={isSubmitting}
                className="max-w-xl"
              />
              {urls.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddUrl}
          disabled={isSubmitting || urls.length >= 10}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add URL
        </Button>
        <p className="text-muted-foreground text-xs">
          Add up to 10 URLs to scan (product pages, homepage, etc.)
        </p>
      </div>

      {/* Scan Mode */}
      <div className="space-y-2">
        <Label>Scan Mode</Label>
        <div className="flex gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="quick"
              checked={mode === "quick"}
              onChange={e =>
                setMode(e.target.value as "quick" | "standard" | "deep")
              }
              disabled={isSubmitting}
              className="accent-primary"
            />
            <span className="text-sm">
              Quick <span className="text-muted-foreground">(1-3 pages)</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="standard"
              checked={mode === "standard"}
              onChange={e =>
                setMode(e.target.value as "quick" | "standard" | "deep")
              }
              disabled={isSubmitting}
              className="accent-primary"
            />
            <span className="text-sm">
              Standard{" "}
              <span className="text-muted-foreground">(5-10 pages)</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="deep"
              checked={mode === "deep"}
              onChange={e =>
                setMode(e.target.value as "quick" | "standard" | "deep")
              }
              disabled={isSubmitting}
              className="accent-primary"
            />
            <span className="text-sm">
              Deep <span className="text-muted-foreground">(20+ pages)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Scan...
            </>
          ) : (
            "Start Scan"
          )}
        </Button>
      </div>
    </form>
  )
}

