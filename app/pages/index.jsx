import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Onboarding from "./Onboarding";

import Treasury from "./Treasury";

import Activity from "./Activity";

import Projects from "./Projects";

import Voting from "./Voting";

import Hub from "./Hub";

import Learning from "./Learning";

import Profile from "./Profile";

import Manifesto from "./Manifesto";

import Style from "./Style";

import CreateProject from "./CreateProject";

import ResourceDetail from "./ResourceDetail";

import Engage from "./Engage";

import HostEvent from "./HostEvent";

import EditorTest from "./EditorTest";

import ShareKnowledge from "./ShareKnowledge";

import StartCircle from "./StartCircle";

import Brand from "./Brand";

import Terms from "./Terms";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Onboarding: Onboarding,
    
    Treasury: Treasury,
    
    Activity: Activity,
    
    Projects: Projects,
    
    Voting: Voting,
    
    Hub: Hub,
    
    Learning: Learning,
    
    Profile: Profile,
    
    Manifesto: Manifesto,
    
    Style: Style,
    
    CreateProject: CreateProject,
    
    ResourceDetail: ResourceDetail,
    
    Engage: Engage,
    
    HostEvent: HostEvent,
    
    EditorTest: EditorTest,
    
    ShareKnowledge: ShareKnowledge,
    
    StartCircle: StartCircle,
    
    Brand: Brand,
    
    Terms: Terms,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Treasury" element={<Treasury />} />
                
                <Route path="/Activity" element={<Activity />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Voting" element={<Voting />} />
                
                <Route path="/Hub" element={<Hub />} />
                
                <Route path="/Learning" element={<Learning />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Manifesto" element={<Manifesto />} />
                
                <Route path="/Style" element={<Style />} />
                
                <Route path="/CreateProject" element={<CreateProject />} />
                
                <Route path="/ResourceDetail" element={<ResourceDetail />} />
                
                <Route path="/Engage" element={<Engage />} />
                
                <Route path="/HostEvent" element={<HostEvent />} />
                
                <Route path="/EditorTest" element={<EditorTest />} />
                
                <Route path="/ShareKnowledge" element={<ShareKnowledge />} />
                
                <Route path="/StartCircle" element={<StartCircle />} />
                
                <Route path="/Brand" element={<Brand />} />
                
                <Route path="/Terms" element={<Terms />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}