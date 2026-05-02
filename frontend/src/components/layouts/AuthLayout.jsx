import React from 'react'
import CARD_2 from "../../assets/images/card2.png"
const AuthLayout = ({ children }) => {
    return <div className='flex'>
        <div className='w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12'>
            <h2 className='text-lg font-medium text-black'> ExpenseApp</h2>
            {children}
        </div>
        <div className='hidden md:block w-[40vw] h-screen bg-violet-50 bg-auth-bg-img bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative'>
            <div className="w-48 h-48 rounded-[40px] bg-purple-600 absolute -top-7 -left-5"></div>
            <div className="w-48 h-48 rotate-40 rounded-[40px] border-4 border-fuchsia-600 absolute -top-[30%] -right-10"></div>
            <div className="w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5 "></div>
            <img
                className='w-64 lg:w-[90%] absolute bottom-10 left-1/2 -translate-x-1/2 z-10 shadow-lg shadow-violet-300/30 rounded-lg'
                src={CARD_2}
                alt="Expense card illustration"
            />
        </div>
    </div>;

};

export default AuthLayout