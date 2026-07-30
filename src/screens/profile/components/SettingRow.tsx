import {
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { ChevronRight } from "lucide-react-native";


export default function SettingRow({
    icon:Icon,
    title,
    subtitle,
    color="#666666",
    onPress
}:any){


return(

<TouchableOpacity

onPress={onPress}

className="flex-row items-center px-4 py-4 border-b border-gray-100"

>


<Icon
size={20}
color={color}
/>


<View className="flex-1 ml-3">


<Text className="text-sm text-gray-800 font-medium">

{title}

</Text>


<Text className="text-xs text-gray-500 mt-1">

{subtitle}

</Text>


</View>



<ChevronRight
size={20}
color="#AAAAAA"
/>


</TouchableOpacity>

)

}