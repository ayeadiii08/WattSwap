"use client";

import { useState } from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function SurplusPost() {
  const { isConnected } = useWallet();
  const { postSurplus } = useContract();
  const [kwh, setKwh] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!kwh || !price) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await postSurplus(kwh, price);
      toast.success("Surplus energy listed for auction!");
      setKwh("");
      setPrice("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post surplus";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Post Surplus Energy
        </CardTitle>
        <CardDescription>
          List your surplus energy for auction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Available kWh"
          value={kwh}
          onChange={(e) => setKwh(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Price per kWh (stroops)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button
          onClick={handlePost}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Surplus"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
