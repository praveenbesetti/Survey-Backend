import mongoose, { model } from "mongoose";

const employeeSchema= new mongoose.Schema({
    name:{type:String},
    email:{type:String},
    phone:{type:String},
    password:{type:String}
})

export const  Employee=mongoose.model("Employee",employeeSchema)