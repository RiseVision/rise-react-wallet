import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  accountOverviewRoute,
  onboardingExistingAccountRoute,
  onboardingNoMnemonicNoticeRoute,
  onboardingAddAccountRoute
} from '../../routes';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';

interface Props {}

interface PropsInjected extends Props {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('onboardingStore')
@inject('routerStore')
@inject('walletStore')
@observer
// TODO handle missing onboardingStore.address using a redir
class ExistingAccountTypePage extends React.Component<Props> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  constructor(props: Props) {
    super(props);
    const { routerStore, onboardingStore } = this.injected;
    if (!onboardingStore.address) {
      routerStore.goTo(onboardingAddAccountRoute);
    }
  }

  handleFullAccessClick = async () => {
    const { routerStore, onboardingStore, walletStore } = this.injected;
    const address = onboardingStore.address!;

    let hasFullAccessAccounts = false;
    for (const account of walletStore.accounts.values()) {
      if (!account.readOnly) {
        hasFullAccessAccounts = true;
        break;
      }
    }

    walletStore.login(address, { readOnly: false }, true);
    if (hasFullAccessAccounts) {
      routerStore.goTo(accountOverviewRoute, { id: address });
    } else {
      routerStore.goTo(onboardingNoMnemonicNoticeRoute);
    }
  }

  handleReadOnlyClick = () => {
    const { routerStore, onboardingStore, walletStore } = this.injected;
    const address = onboardingStore.address!;
    walletStore.login(address, { readOnly: true }, true);
    routerStore.goTo(accountOverviewRoute, { id: address });
  }

  render() {
    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingExistingAccountRoute }}>
          <FormattedMessage
            id="onboarding-existing-account-type.title"
            description="Existing account type screen title"
            defaultMessage="Account type"
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true} onClick={this.handleFullAccessClick}>
            <ListItemText
              primary={
                <FormattedMessage
                  id="onboarding-existing-account-type.full-access"
                  description="Existing full access account button title"
                  defaultMessage="Full access account"
                />
              }
              secondary={
                <FormattedMessage
                  id="onboarding-existing-account-type.full-access-tip"
                  description="Existing full access account button tip"
                  defaultMessage={'I know the secret mnemonic for this account'}
                />
              }
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true} onClick={this.handleReadOnlyClick}>
            <ListItemText
              primary={
                <FormattedMessage
                  id="onboarding-existing-account-type.read-access"
                  description="Existing read access account button title"
                  defaultMessage="Watch only account"
                />
              }
              secondary={
                <FormattedMessage
                  id="onboarding-existing-account-type.read-access-tip"
                  description="Existing read access account button tip"
                  defaultMessage={
                    'I don\'t know the secret mnemonic for this account'
                  }
                />
              }
            />
            <ChevronRight />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default ExistingAccountTypePage;
