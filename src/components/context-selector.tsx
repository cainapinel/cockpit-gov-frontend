import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ContextSelector() {
  return (
    <Select defaultValue="rj">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione a Região..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="rj">Rio de Janeiro (Capital)</SelectItem>
        <SelectItem value="sg">São Gonçalo</SelectItem>
        <SelectItem value="ni">Nova Iguaçu</SelectItem>
        <SelectItem value="cg">Campos dos Goytacazes</SelectItem>
      </SelectContent>
    </Select>
  )
}
