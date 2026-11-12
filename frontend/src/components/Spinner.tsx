import { Loader2 } from "lucide-react";

const Spinner = ({ size = 16 }: { size?: number }) => (
  <Loader2 size={size} className="animate-spin" aria-hidden="true" />
);

export default Spinner;
