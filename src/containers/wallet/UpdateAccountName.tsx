import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { accountSettingsNameRoute } from '../../routes';
import AccountStore from '../../stores/account';
import AccountNameDialog from '../../components/dialogs/AccountNameDialog';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
}

@inject('routerStore')
@observer
class UpdateAccountName extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleChange = (data: { name: string }) => {
    const { account, onNavigateBack } = this.injected;
    account.name = data.name;
    onNavigateBack();
  }

  render() {
    const { account, onNavigateBack, routerStore } = this.injected;

    const isOpen = routerStore.currentView === accountSettingsNameRoute;

    return (
      <AccountNameDialog
        account={{
          name: account.name,
          address: account.id,
        }}
        open={isOpen}
        onCloseClick={onNavigateBack}
        onChange={this.handleChange}
      />
    );
  }
}

export default UpdateAccountName;
