import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useState } from "react";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react-native";

import {
  useRouter,
} from "expo-router";


import {
  signInWithEmailAndPassword,
} from "firebase/auth";


import {
  auth,
} from "../../firebase/firebase";





function AirbnbInput({
  label,
  placeholder,
  value,
  onChange,
  secure,
  right,

}:{
  label:string;
  placeholder:string;
  value:string;
  onChange:(text:string)=>void;
  secure?:boolean;
  right?:React.ReactNode;

}){


return (

<View className="mb-4">


<Text className="text-sm font-semibold text-[#222222] mb-2">

{label}

</Text>




<View className="flex-row items-center border border-[#DDDDDD] rounded-xl px-4 py-3">


<TextInput

className="flex-1 text-[15px] text-[#222222]"

placeholder={placeholder}

placeholderTextColor="#717171"

value={value}

onChangeText={onChange}

secureTextEntry={secure}

/>


{right}


</View>



</View>

)

}





export default function LoginScreen(){


const router = useRouter();



const [email,setEmail]=useState("");

const [password,setPassword]=useState("");

const [showPass,setShowPass]=useState(false);

const [loading,setLoading]=useState(false);





const handleLogin = async()=>{


if(!email || !password){

return;

}



try{


setLoading(true);



await signInWithEmailAndPassword(

auth,

email,

password

);



router.replace("/home");



}

catch(error:any){


Alert.alert(

"Login Failed",

error.message

);


}

finally{


setLoading(false);


}


};







return (

<SafeAreaView className="flex-1 bg-white">





{/* Header */}


<View className="px-6 pt-8 pb-6">


<TouchableOpacity

onPress={()=>router.back()}

className="w-9 h-9 rounded-full border border-[#DDDDDD] items-center justify-center mb-8"

>


<ArrowLeft

size={17}

color="#222222"

/>


</TouchableOpacity>





<Text className="text-[26px] font-bold text-[#222222]">

Welcome back

</Text>



<Text className="text-[#717171] text-[15px] mt-1">

Log in to your SheShield account

</Text>



</View>









<View className="flex-1 px-6">






{/* Social Buttons */}


<View className="flex-row gap-3 mb-4">



<TouchableOpacity

className="flex-1 flex-row items-center justify-center py-3 border border-[#DDDDDD] rounded-xl"

>


<Text className="font-semibold text-sm text-[#222222]">

Google

</Text>


</TouchableOpacity>





<TouchableOpacity

className="flex-1 flex-row items-center justify-center py-3 border border-[#DDDDDD] rounded-xl"

>


<Text className="font-semibold text-sm text-[#222222]">

Apple

</Text>


</TouchableOpacity>



</View>








{/* Divider */}



<View className="flex-row items-center gap-3 mb-4">


<View className="flex-1 h-px bg-[#DDDDDD]" />


<Text className="text-xs text-[#717171] font-medium">

or

</Text>



<View className="flex-1 h-px bg-[#DDDDDD]" />



</View>







{/* Inputs */}



<AirbnbInput


label="Email address"


placeholder="you@example.com"


value={email}


onChange={setEmail}


/>






<AirbnbInput


label="Password"


placeholder="Your password"


value={password}


onChange={setPassword}


secure={!showPass}



right={


<TouchableOpacity

onPress={()=>setShowPass(!showPass)}

>


{

showPass

?

<EyeOff size={17} color="#717171"/>

:

<Eye size={17} color="#717171"/>

}



</TouchableOpacity>


}


/>








{/* Forgot password */}



<View className="items-end -mt-1">


<TouchableOpacity>


<Text className="text-sm font-semibold text-[#222222] underline">

Forgot password?

</Text>


</TouchableOpacity>


</View>








{/* Login Button */}



<TouchableOpacity


onPress={handleLogin}


disabled={!email || !password || loading}


className={`w-full py-4 rounded-xl mt-4 ${

email && password && !loading

?

"bg-[#FF385C]"

:

"bg-[#F7F7F7]"

}`}



>


<Text

className={`text-center font-bold text-[15px] ${

email && password && !loading

?

"text-white"

:

"text-[#BBBBBB]"

}`}

>


{

loading

?

"Logging in..."

:

"Log in"

}


</Text>


</TouchableOpacity>







{/* Signup link */}



<View className="flex-row justify-center mt-5">


<Text className="text-sm text-[#717171]">

Don't have an account?

</Text>



<TouchableOpacity

onPress={()=>router.push("/signup")}

>


<Text className="font-bold text-[#222222] underline ml-1">

Sign up

</Text>



</TouchableOpacity>


</View>






</View>







{/* Legal */}


<Text className="px-8 pb-8 pt-4 text-center text-[11px] text-[#717171]">

By continuing, you agree to SheShield's Terms of Service and Privacy Policy.

</Text>




</SafeAreaView>


);


}