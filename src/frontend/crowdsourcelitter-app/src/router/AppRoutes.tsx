import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/AuthPages/Login';
import SignUp from '../pages/AuthPages/Signup';

export const AppRoutes: React.FC = () => {
    return (
        <>
            <Route exact path="/login" component={Login} />

            <Route exact path="/signup" component={SignUp} />

            <Route exact path="/home" component={Home} />
            

            <ProtectedRoute exact path="/dashboard" component={Dashboard} />
                
        </>
    )
}