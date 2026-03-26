import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Home from '../pages/HomePage';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/AuthPages/LoginPage';
import SignUp from '../pages/AuthPages/SignupPage';
import Orgs from '../pages/BrowseOrgsPage';
import MyOrg from '../pages/OrgPage';
import BrowseLocations from '../pages/BrowseLocationsPage';

export const AppRoutes: React.FC = () => {
    return (
        <>
            <Route exact path="/login" component={Login} />

            <Route exact path="/signup" component={SignUp} />

            <Route exact path="/home" component={Home} />
            

            <ProtectedRoute exact path="/dashboard" component={Dashboard} />
            <ProtectedRoute exact path="/browse-orgs" component={Orgs} />
            <ProtectedRoute exact path="/org" component={MyOrg} />
            <ProtectedRoute exact path="/browse-locations" component={BrowseLocations} />
                
        </>
    )
}