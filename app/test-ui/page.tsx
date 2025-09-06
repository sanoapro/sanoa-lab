import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function TestUI() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-brand-border bg-white/70">
        <CardHeader>
          <CardTitle className="font-heading text-brand-primary">
            Componentes shadcn/ui
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" />
          </div>
          <Button className="bg-brand-primary text-white hover:opacity-90">
            Botón primario
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
