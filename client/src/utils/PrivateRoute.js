import React from "react";
import { Redirect, Switch, Route, Link } from "react-router-dom";

function PrivateRoute({ children, authed, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        authed ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}
export default PrivateRoute;
