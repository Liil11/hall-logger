import { UserRound } from "lucide-react";
import type { RecordModel } from "pocketbase";
import { pb } from "../services/pocketbase";

interface AvatarProps {
  record?: RecordModel | null;
  src?: string;
  size?: number;
  className?: string;
}

// Square with rounded corners, used for both the image and the placeholder.
const Avatar = ({ record, src, size = 40, className = "" }: AvatarProps) => {
  const filename = (record?.avatar as string | undefined) ?? "";
  const url =
    src || (filename ? pb.files.getURL(record!, filename, { thumb: `${size}x${size}` }) : "");

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-indigo-500 ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound size={Math.max(14, Math.round(size * 0.5))} />
      )}
    </span>
  );
};

export default Avatar;
