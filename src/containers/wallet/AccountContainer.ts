import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';

interface Props {
  accountStore?: AccountStore;
  account?: AccountStore;
}

@inject(accountStore)
@observer
export default class AccountContainer<GProps, GState> extends React.Component<
  GProps & Props,
  GState
> {
  get account(): AccountStore {
    return this.props.account! || this.props.accountStore!;
  }
}
