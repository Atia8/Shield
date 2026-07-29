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
  Check,
  Eye,
  EyeOff,
  Smartphone,
} from "lucide-react-native";

import {
  useRouter,
} from "expo-router";


import {
  createUserWithEmailAndPassword,
} from "firebase/auth";


import {
  doc,
  setDoc,
} from "firebase/firestore";


import {
  auth,
  db,
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

className="flex-1 text-[15px]"

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





export default function SignupScreen(){


const router = useRouter();



const [step,setStep] = useState<1|2>(1);



const [name,setName] = useState("");

const [email,setEmail] = useState("");

const [phone,setPhone] = useState("");

const [password,setPassword] = useState("");

const [showPass,setShowPass] = useState(false);

const [agreed,setAgreed] = useState(false);

const [loading,setLoading] = useState(false);



const progress = step===1 ? 50 : 100;



const handleNext = ()=>{


if(!name || !email){

Alert.alert(
"Missing Information",
"Name and email are required"
);

return;

}


setStep(2);


};






const handleSignup = async()=>{


if(password.length < 6 || !agreed){

return;

}


try{


setLoading(true);



/*
  Firebase Authentication
*/

const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);



const uid =
userCredential.user.uid;





/*
  Firestore user profile
  Matching existing backend
*/

await setDoc(

doc(db,"users",uid),

{


name:name,

email:email,

phone:phone,


address:"",


gender:"female",


helperLevel:0,


isHelperVerified:false,


userType:"user",


createdAt:Date.now(),


updatedAt:Date.now()


}

);




Alert.alert(
"Success",
"Account created successfully"
);



router.replace("/home");



}

catch(error:any){


Alert.alert(
"Signup Failed",
error.message
);


}

finally{


setLoading(false);


}


};





return (


<SafeAreaView className="flex-1 bg-white">



{/* HEADER */}


<View className="px-6 pt-8 pb-5">


<TouchableOpacity

onPress={()=>{

if(step===2){

setStep(1);

}

else{

router.back();

}

}}

className="w-9 h-9 rounded-full border border-[#DDDDDD] items-center justify-center mb-8"

>

<ArrowLeft

size={17}

color="#222"

/>


</TouchableOpacity>






<View className="mb-5">


<View className="flex-row justify-between mb-2">


<Text className="text-xs font-semibold text-[#717171]">

Step {step} of 2

</Text>



<Text className="text-xs font-semibold text-[#717171]">

{progress}%

</Text>



</View>



<View className="h-[3px] bg-[#F7F7F7] rounded-full">


<View

className="h-full bg-[#FF385C] rounded-full"

style={{
width:`${progress}%`
}}


/>


</View>



</View>







{

step===1 ?


<>


<Text className="text-[26px] font-bold text-[#222222]">

Create your account

</Text>


<Text className="text-[#717171] text-[15px] mt-1">

Join SheShield — it only takes a minute

</Text>


</>



:


<>


<Text className="text-[26px] font-bold text-[#222222]">

Secure your account

</Text>


<Text className="text-[#717171] text-[15px] mt-1">

Set a strong password to protect your safety

</Text>


</>



}



</View>






<View className="flex-1 px-6">





{
step===1 &&

<>


<AirbnbInput

label="Full name"

placeholder="Emma Johnson"

value={name}

onChange={setName}

/>



<AirbnbInput

label="Email address"

placeholder="you@example.com"

value={email}

onChange={setEmail}

/>



<AirbnbInput

label="Phone number (optional)"

placeholder="+880 1XXXXXXXXX"

value={phone}

onChange={setPhone}

right={
<Smartphone size={16} color="#BBBBBB"/>
}

/>





<TouchableOpacity

onPress={handleNext}

className={`w-full py-4 rounded-xl mt-2 ${
name && email
?
"bg-[#FF385C]"
:
"bg-[#F7F7F7]"
}`}

>


<Text className={`text-center font-bold ${
name && email
?
"text-white"
:
"text-[#BBBBBB]"
}`}>

Continue

</Text>


</TouchableOpacity>






<View className="flex-row justify-center mt-6">


<Text className="text-[#717171]">

Already have an account?

</Text>



<TouchableOpacity
onPress={()=>router.push("/login")}
>

<Text className="font-bold underline ml-1 text-[#222222]">

Log in

</Text>


</TouchableOpacity>


</View>



</>

}








{
step===2 &&

<>


<View className="flex-row items-center bg-[#F7F7F7] rounded-xl px-4 py-3 mb-5">


<View className="w-10 h-10 rounded-full bg-[#FF385C] items-center justify-center">


<Text className="text-white font-bold">

{name.charAt(0).toUpperCase()}

</Text>


</View>




<View className="ml-3">


<Text className="font-bold">

{name}

</Text>


<Text className="text-xs text-[#717171]">

{email}

</Text>


</View>





<TouchableOpacity

className="ml-auto"

onPress={()=>setStep(1)}

>

<Text className="text-xs font-bold underline">

Edit

</Text>


</TouchableOpacity>



</View>







<AirbnbInput

label="Create password"

placeholder="Min. 8 characters"

value={password}

onChange={setPassword}

secure={!showPass}

right={

<TouchableOpacity

onPress={()=>setShowPass(!showPass)}

>

{

showPass ?

<EyeOff size={17} color="#717171"/>

:

<Eye size={17} color="#717171"/>

}


</TouchableOpacity>

}

/>








<TouchableOpacity

className="flex-row items-start mb-5"

onPress={()=>setAgreed(!agreed)}

>


<View

className={`w-5 h-5 rounded-md border-2 mr-3 items-center justify-center ${
agreed
?
"bg-[#222222] border-[#222222]"
:
"border-[#DDDDDD]"
}`}

>


{
agreed &&
<Check size={12} color="white"/>
}


</View>




<Text className="flex-1 text-sm text-[#717171]">

I agree to SheShield's Terms of Service and Privacy Policy

</Text>



</TouchableOpacity>








<TouchableOpacity

onPress={handleSignup}

disabled={loading}

className={`w-full py-4 rounded-xl ${
password.length>=6 && agreed
?
"bg-[#FF385C]"
:
"bg-[#F7F7F7]"
}`}

>


<Text className={`text-center font-bold ${
password.length>=6 && agreed
?
"text-white"
:
"text-[#BBBBBB]"
}`}>

{
loading
?
"Creating account..."
:
"Create account"
}


</Text>


</TouchableOpacity>



</>

}





</View>






<Text className="px-8 pb-8 text-center text-[11px] text-[#717171]">

Your data is encrypted and never shared without your permission.

</Text>



</SafeAreaView>

);

}