import {
    Bell,
    Home,
    Shield,
    User
} from "lucide-react-native";

import {
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    SafeAreaView
} from "react-native-safe-area-context";

import {
    usePathname,
    useRouter
} from "expo-router";


const navItems = [
  {
    name:"Home",
    path:"/home",
    icon:Home
  },
  {
    name:"Alerts",
    path:"/alerts",
    icon:Bell
  },
  {
    name:"Safety",
    path:"/safety",
    icon:Shield
  },
  {
    name:"Profile",
    path:"/profile",
    icon:User
  }
];


export default function BottomNav(){

const router = useRouter();
const pathname = usePathname();


return (

<SafeAreaView
edges={["bottom"]}
className="bg-white border-t border-gray-200"
>


<View
className="
h-16
flex-row
items-center
"
>


{
navItems.map((item)=>{


const Icon=item.icon;

const active = pathname === item.path;


return (

<TouchableOpacity

key={item.name}

onPress={()=>router.push(item.path as any)}

className="
flex-1
items-center
justify-center
"


>


<Icon

size={22}

color={
active
?
"#FF385C"
:
"#999999"
}

/>


<Text

className={`
text-xs mt-1
${active 
? "text-[#FF385C]" 
: "text-gray-400"}
`}

>

{item.name}

</Text>


</TouchableOpacity>


)


})

}


</View>


</SafeAreaView>


)

}