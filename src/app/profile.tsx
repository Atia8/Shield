import {
    View
} from "react-native";


import ProfileScreen from "../screens/profile/ProfileScreen";

import BottomNav from "../components/navigation/BottomNav";


export default function Profile(){

return(

<View className="flex-1">


<View className="flex-1">

<ProfileScreen/>

</View>


<BottomNav/>


</View>


)

}