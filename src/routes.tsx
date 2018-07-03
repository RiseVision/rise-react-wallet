import * as React from "react";
import ModalBackdrop from "./components/ModalBackdrop";

//models
import { Route } from "mobx-router";

//components
// TODO lazy load
import Onboarding from "./containers/Onboarding";
import Wallet from "./containers/Wallet";

const views = {
  // home: new Route({
  //   path: '/',
  //   component: <Home/>
  // }),
  onboarding: new Route({
    path: "/onboarding/:page",
    component: (
      <React.Fragment>
        <ModalBackdrop open={true} transitionDuration={0} />
        // @ts-ignore
        <Onboarding />
      </React.Fragment>
    ),
    // @ts-ignore
    onEnter: (route, params, store, queryParams) => {
      debugger
      if (!params.page) {
        params.page = "add-account";
      }
      console.log("entering Onboarding");
    },
    beforeExit: () => {
      console.log("exiting Onboarding");
    },
    // @ts-ignore
    onParamsChange: (route, params, store) => {
      console.log("params changed to", params);
    }
  }),
  wallet: new Route({
    path: "/wallet",
    // @ts-ignore
    component: <Wallet />,
    // @ts-ignore
    onEnter: (route, params, store, queryParams) => {
      store.gallery.fetchImages();
      console.log("current query params are -> ", queryParams);
    },
    beforeExit: () => {
      const result = confirm("Are you sure you want to leave the gallery?");
      return result;
    }
  })
};
export default views;
