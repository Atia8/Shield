import {
    Text,
    View
} from "react-native";

import {
    Camera,
    User
} from "lucide-react-native";


export default function ProfileHeader({
name
}:{
name:string
}){


return(

<View className="bg-purple-600 px-6 pt-12 pb-8 rounded-b-3xl">


<Text className="text-white text-2xl font-bold mb-5">

Profile & Settings

</Text>



<View className="bg-white/20 rounded-2xl p-4">


<View className="flex-row items-center">


<View className="relative">


<View className="w-16 h-16 bg-purple-300 rounded-full items-center justify-center">


<User
size={32}
color="#6B21A8"
/>


</View>


<View className="absolute bottom-0 right-0 bg-white w-6 h-6 rounded-full items-center justify-center">

<Camera
size={14}
color="#9333EA"
/>

</View>


</View>




<View className="ml-4">


<Text className="text-white text-lg font-semibold">

{name}

</Text>



<Text className="text-purple-200 text-sm">

Member since 2024

</Text>


</View>


</View>


</View>


</View>

)

}