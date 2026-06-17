import React from 'react';

// page components
import CiisHeader from '../components/CiisHeader';
import FeaturesSection from '../components/FeaturesSection';
import Logo from '../components/Logo';
import Crm from '../components/Crm';
import Comparison from '../components/Comparison';
import Footer from '../components/Footer';
import HeroSection from '../componentsCSS/HeroSection';
import Beyond from '../components/beyond';
import Cta from '../components/Cta';
import Bannerbtn from '../components/Bannerbtn';
// icons

import Applinks from '../components/Applinks';

// styles
import '../componentsCSS/ciis.css';

// image imports (used in features)
import icon1 from '../image/ciis/1.png';
import icon2 from '../image/ciis/2.png';
import icon3 from '../image/ciis/3.png';
import icon4 from '../image/ciis/4.png';
import icon5 from '../image/ciis/5.png';
import icon6 from '../image/ciis/6.png';
import icon7 from '../image/ciis/7.png';
import icon8 from '../image/ciis/8.png';
import icon9 from '../image/ciis/9.png';
import icon10 from '../image/ciis/10.png';
import icon11 from '../image/ciis/11.png';
import icon12 from '../image/ciis/111.png';
import icon13 from '../image/ciis/13.png';
import icon14 from '../image/ciis/14.png';

function Ciis() {
    const myFeatures = [
        {
            title: 'Live Team Status',
            description: 'See the real-time status (e.g., available, on call, on break) of every agent on your team',
            icon: icon1,
        },
        {
            title: 'AI Sentiment Analysis',
            description: 'Get insights into how leads or customers felt during the call.',
            icon: icon2,
        },
        {
            title: 'Call Recording',
            description: 'Monitor call quality and train your team effectively with recordings.',
            icon: icon3,
        },
        {
            title: 'AI Call Summaries',
            description: 'Save time reviewing interactions with quick, AI summaries of call recordings',
            icon: icon4,
        },
        {
            title: 'Real-Time Dashboards',
            description: 'Access live performance metrics and team activity instantly via clear dashboards',
            icon: icon5,
        },
        {
            title: 'Auto Dialer',
            description: 'Boost calling efficiency by automating the dialing process for your sales reps',
            icon: icon6,
        },
        {
            title: 'AI Chat Assistant',
            description: 'Ask for insights or have AI perform actions like scheduling calls.',
            icon: icon7,
        },
        {
            title: 'Auto Lead Allocation',
            description: 'Instantly assign new leads to the right reps automatically, improving response time',
            icon: icon8,
        },
        {
            title: 'Interaction Timeline',
            description: 'Easily review the entire communication history with a lead in one consolidated timeline view',
            icon: icon9,
        },
        {
            title: 'Funnel Management',
            description: 'Visually manage your sales pipeline and easily move deals between stages',
            icon: icon10,
        },
        {
            title: 'Follow-Up Notifications',
            description: 'Receive automatic reminders for all upcoming follow-up activities to stay on track',
            icon: icon11,
        },
        {
            title: 'Advanced Caller ID',
            description: 'Displays caller\'s name and recent conversation details before you answer.',
            icon: icon12,
        },
        {
            title: 'Message Templates',
            description: 'Use professional, natural-sounding message templates for faster responses',
            icon: icon13,
        },
        {
            title: 'CRM Customisation',
            description: 'Easily adapt the CRM by modifying custom data fields to match your specific process',
            icon: icon14,
        },
    ];

    return (
        <>
            <CiisHeader />
            <HeroSection />
            {/*  */}
            <Comparison />

            {/*  */}
            <Beyond />

            <FeaturesSection
                title="Built for Doers, Dreamers, and Deal Closers: Peep In."
                subheading="Manage calls, track insights, and close deals, everything from your mobile phone"
                features={myFeatures}
            />
            {/*  */}
            <Bannerbtn
                title="Get a personalized walkthrough of CiisNetwork
                
                in action"
                buttonText="Schedule Your Demo"
                backgroundImage="/image.png"
                onClick={() => alert("Demo scheduled")}
            />
            {/*  */}
            <Cta />
            {/*  */}
            <Logo />
            {/*  */}
            <Crm />

            {/*  */}
            <Applinks />
            <Footer />


        </>
    );
}

export default Ciis
