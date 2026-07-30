// export default function Home() {
//   return null;
// }

import { Text, View } from "react-native";
import BottomNav from "../components/navigation/BottomNav";


export default function Home(){

return(

<View className="flex-1 bg-white">


<View className="flex-1 items-center justify-center">

<Text className="text-2xl font-bold">
SheShield Home
</Text>

<Text className="text-gray-500 mt-2">
Home screen coming soon
</Text>

</View>


<BottomNav/>


</View>

)

}