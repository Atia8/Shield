import { ArrowLeft } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

type Props = {
  onPress: () => void;
};

export default function BackButton({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="w-10 h-10 rounded-full border border-borderGray items-center justify-center"
    >
      <ArrowLeft size={18} color="#222222" />
    </TouchableOpacity>
  );
}