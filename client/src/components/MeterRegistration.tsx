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
import { Loader2, Gauge } from "lucide-react";
import { toast } from "sonner";

export function MeterRegistration() {
  const { isConnected, address } = useWallet();
  const { registerMeter, getMeter } = useContract();
  const [meterId, setMeterId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [meterInfo, setMeterInfo] = useState<{
    meter_id: string;
    capacity: string;
    active: boolean;
  } | null>(null);
  const [loadingMeter, setLoadingMeter] = useState(false);

  const handleRegister = async () => {
    if (!meterId || !capacity) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await registerMeter(meterId, capacity);
      toast.success("Meter registered successfully!");
      setMeterId("");
      setCapacity("");
      // Refresh meter info
      if (address) {
        const info = await getMeter(address);
        setMeterInfo(info);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMeter = async () => {
    if (!address) return;
    setLoadingMeter(true);
    try {
      const info = await getMeter(address);
      setMeterInfo(info);
    } catch {
      setMeterInfo(null);
    } finally {
      setLoadingMeter(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meter Registration</CardTitle>
          <CardDescription>Connect your wallet to register a smart meter</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Smart Meter Registration
        </CardTitle>
        <CardDescription>
          Register your energy meter to start trading surplus energy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Meter ID (e.g., MTR-001)"
            value={meterId}
            onChange={(e) => setMeterId(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Capacity (kWh)"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Button onClick={handleRegister} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Meter"
            )}
          </Button>
        </div>

        <div className="border-t pt-4 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckMeter}
            disabled={loadingMeter}
          >
            {loadingMeter ? "Loading..." : "Check My Meter"}
          </Button>
          {meterInfo && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-zinc-500">Meter:</span> {meterInfo.meter_id}
              </p>
              <p>
                <span className="text-zinc-500">Capacity:</span>{" "}
                {meterInfo.capacity} kWh
              </p>
              <p>
                <span className="text-zinc-500">Status:</span>{" "}
                {meterInfo.active ? "Active" : "Inactive"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
