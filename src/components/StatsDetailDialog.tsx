import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Heart, Star } from "lucide-react";

interface StatsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    publishedProductsCount: number;
    likesCount: number;
    favoritesCount: number;
  };
}

export function StatsDetailDialog({
  open,
  onOpenChange,
  stats,
}: StatsDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-center">获赞与收藏</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-muted-foreground">发布产品数</span>
              <span className="font-bold text-lg">{stats.publishedProductsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-muted-foreground">获得点赞数</span>
              <span className="font-bold text-lg">{stats.likesCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-muted-foreground">获得收藏数</span>
              <span className="font-bold text-lg">{stats.favoritesCount}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="gradient"
          className="w-full rounded-full mt-2" 
          onClick={() => onOpenChange(false)}
        >
          我知道了
        </Button>
      </DialogContent>
    </Dialog>
  );
}
