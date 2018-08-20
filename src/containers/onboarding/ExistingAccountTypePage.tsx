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
  onboardingNoMnemonicNoticeRoute
} from '../../routes';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';

interface Props {
  routerStore?: RouterStore;
  onboardingStore?: OnboardingStore;
  walletStore?: WalletStore;
}

@inject('routerStore')
@inject('onboardingStore')
@inject('walletStore')
@observer
class ExistingAccountTypePage extends React.Component<Props> {
  handleBackClick = () => {
    const { routerStore } = this.props;
    routerStore!.goTo(onboardingExistingAccountRoute);
  }

  handleFullAccessClick = async () => {
    const { routerStore, onboardingStore, walletStore } = this.props;
    const address = onboardingStore!.address;
    if (address) {
      walletStore!.login(address, { readOnly: false }, true);
    }
    routerStore!.goTo(onboardingNoMnemonicNoticeRoute);
  }

  handleReadOnlyClick = () => {
    const { routerStore, onboardingStore, walletStore } = this.props;
    const address = onboardingStore!.address;
    if (address) {
      walletStore!.login(address, { readOnly: true }, true);
    }
    routerStore!.goTo(accountOverviewRoute);
  }

  render() {
    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
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
