import { Rise } from 'dpos-offline';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { As } from 'type-tagger';
import VerifyMnemonicDialogContent from '../../components/content/VerifyMnemonicDialogContent';
import Dialog, {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import { accountSettingsVerifyMnemonicRoute } from '../../routes';
import AccountStore from '../../stores/account';
import { RouteLink } from '../../stores/root';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
}

interface State extends ICloseInterruptControllerState {}

@inject('routerStore')
@observer
class VerifyMnemonicDialog extends React.Component<Props>
  implements ICloseInterruptController {
  state: State = {
    formChanged: false
  };

  protected get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = (data: { mnemonic: string }): boolean => {
    const { account } = this.injected;
    // TODO verify that the mnemonic matches the public key
    const publicKey = account.publicKey as string & As<'publicKey'>;
    const match =
      Rise.deriveKeypair(data.mnemonic).publicKey.toString('hex') === publicKey;
    return match;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    return Boolean(this.state.formChanged);
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  }

  render() {
    const { account, navigateBackLink, routerStore, open } = this.injected;

    const isOpen =
      open || routerStore.currentView === accountSettingsVerifyMnemonicRoute;

    return (
      <Dialog
        open={isOpen}
        onCloseRoute={navigateBackLink}
        onClose={this.handleClose}
      >
        <VerifyMnemonicDialogContent
          onFormChanged={this.handleFormChanged}
          account={{
            address: account.id
          }}
          onSubmit={this.handleSubmit}
        />
      </Dialog>
    );
  }
}

export default VerifyMnemonicDialog;
