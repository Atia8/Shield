import {
    Bell,
    Check,
    ChevronRight,
    HelpCircle,
    Lock,
    LogOut,
    MapPin,
    Shield,
    Star,
    Users,
} from "lucide-react-native";

import {
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import {
    signOut
} from "firebase/auth";



interface ProfileProps {
  onNavigate?: (screen: string) => void;
}



export default function ProfileScreen({
  onNavigate = () => {},
}: ProfileProps) {


  const [userData, setUserData] = useState<any>(null);



  useEffect(() => {

    const loadProfile = async () => {

      const user = auth.currentUser;


      if (!user) {
        return;
      }



      try {

        const userRef = doc(
          db,
          "users",
          user.uid
        );


        const snapshot = await getDoc(userRef);



        if(snapshot.exists()){

          setUserData({
            ...snapshot.data(),
            email:user.email
          });

        }
        else{

          setUserData({
            email:user.email,
            name:"User"
          });

        }


      } catch(error){

        console.log(
          "Profile loading error:",
          error
        );

      }


    };


    loadProfile();


  }, []);





  const handleLogout = async()=>{

    try{

      await signOut(auth);

      onNavigate("welcome");

    }
    catch(error){

      console.log(error);

    }

  };






  const settingGroups = [
    {
      title:"Safety",

      items:[
        {
          icon:Shield,
          label:"Safety Preferences",
          sub:"Manage triggers & alerts",
        },

        {
          icon:Bell,
          label:"Notifications",
          sub:"Alert preferences & quiet hours",
        },

        {
          icon:Users,
          label:"Trusted Contacts",
          sub:"3 contacts added",
          action:()=>onNavigate("contacts")
        }
      ]
    },


    {
      title:"Account",

      items:[
        {
          icon:MapPin,
          label:"Location Services",
          sub:"Always on",
        },

        {
          icon:Lock,
          label:"Privacy & Security",
          sub:"",
        },

        {
          icon:HelpCircle,
          label:"Help & Support",
          sub:"",
        }
      ]
    }
  ];





  const stats=[
    {
      value:"87",
      label:"Safety Score"
    },
    {
      value:"24",
      label:"Check-ins"
    },
    {
      value:"3",
      label:"Reports Filed"
    }
  ];





  return(

    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom:120
      }}
    >



      {/* Header */}

      <View className="
        px-6
        pt-12
        pb-6
        border-b
        border-[#DDDDDD]
      ">


        <Text className="
          text-[22px]
          font-bold
          text-[#222222]
          mb-5
        ">
          Profile
        </Text>



        <View className="
          flex-row
          items-center
          gap-4
        ">



          <View className="relative">


            <View className="
              w-20
              h-20
              rounded-full
              bg-[#F7F7F7]
              items-center
              justify-center
            ">


              <Text className="text-3xl">
                👩
              </Text>


            </View>




            <View className="
              absolute
              bottom-0
              right-0
              w-6
              h-6
              bg-[#00A699]
              rounded-full
              border-2
              border-white
              items-center
              justify-center
            ">

              <Check
                size={12}
                color="white"
                strokeWidth={3}
              />

            </View>


          </View>




          <View>

            <Text className="
              text-xl
              font-bold
              text-[#222222]
            ">

              {userData?.name || "Loading..."}

            </Text>



            <Text className="
              text-sm
              text-[#717171]
            ">

              {userData?.email || ""}

            </Text>



            <View className="
              flex-row
              items-center
              gap-1
              mt-1
            ">


              <Star
                size={12}
                fill="#FF385C"
                color="#FF385C"
              />


              <Text className="
                text-xs
                font-bold
                text-[#222222]
              ">
                4.98
              </Text>



              <Text className="
                text-xs
                text-[#717171]
              ">
                · Verified member
              </Text>


            </View>


          </View>


        </View>


      </View>





      {/* Stats */}

      <View className="
        flex-row
        border-b
        border-[#DDDDDD]
      ">


        {
          stats.map((item,index)=>(

            <View
              key={index}
              className={`
                flex-1
                py-5
                items-center
                ${index<2?"border-r border-[#DDDDDD]":""}
              `}
            >

              <Text className="
                text-xl
                font-bold
                text-[#222222]
              ">
                {item.value}
              </Text>


              <Text className="
                text-xs
                text-[#717171]
              ">
                {item.label}
              </Text>


            </View>

          ))
        }


      </View>






      {/* Settings */}

      {
        settingGroups.map((group,index)=>(


          <View key={index}>


            <Text className="
              px-6
              pt-5
              pb-2
              text-xs
              font-bold
              text-[#717171]
            ">

              {group.title}

            </Text>



            {
              group.items.map((item,i)=>{


                const Icon=item.icon;


                return(

                  <Pressable
                    key={i}
                    onPress={item.action}
                    className="
                      flex-row
                      items-center
                      px-6
                      py-4
                      border-t
                      border-[#DDDDDD]
                    "
                  >


                    <View className="
                      w-10
                      h-10
                      rounded-full
                      bg-[#F7F7F7]
                      items-center
                      justify-center
                    ">

                      <Icon
                        size={18}
                        color="#222222"
                      />

                    </View>



                    <View className="
                      flex-1
                      ml-4
                    ">

                      <Text className="
                        text-sm
                        font-semibold
                        text-[#222222]
                      ">
                        {item.label}
                      </Text>


                      {
                        item.sub &&
                        <Text className="
                          text-xs
                          text-[#717171]
                        ">
                          {item.sub}
                        </Text>
                      }


                    </View>



                    <ChevronRight
                      size={16}
                      color="#DDDDDD"
                    />


                  </Pressable>

                )

              })
            }


          </View>


        ))
      }






      {/* Logout */}

      <View className="px-6 py-6">


        <Pressable
          onPress={handleLogout}
          className="
            py-3.5
            border
            border-[#DDDDDD]
            rounded-xl
            flex-row
            justify-center
            items-center
            gap-2
          "
        >

          <LogOut
            size={16}
            color="#222222"
          />


          <Text className="
            text-sm
            font-semibold
            text-[#222222]
          ">
            Sign Out
          </Text>


        </Pressable>



        <Text className="
          text-center
          text-xs
          text-[#717171]
          mt-4
        ">
          SheShield v2.0 · Member since 2023
        </Text>


      </View>




    </ScrollView>

  );

}