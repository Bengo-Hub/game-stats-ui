import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onPageChange: (newOffset: number) => void
  className?: string
}

export function Pagination({
  total,
  limit,
  offset,
  onPageChange,
  className,
}: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const showMax = 5

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, start + showMax - 1)

      if (end === totalPages) {
        start = Math.max(1, end - showMax + 1)
      }

      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 py-4", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onPageChange((page - 1) * limit)}
            className={cn(
              "w-8 h-8",
              currentPage === page && "pointer-events-none"
            )}
          >
            {page}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(offset + limit)}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange((totalPages - 1) * limit)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground ml-2">
        Page {currentPage} of {totalPages} ({total} total)
      </div>
    </div>
  )
}
