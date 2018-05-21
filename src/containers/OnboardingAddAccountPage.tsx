import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon from '../components/FlagIcon';

interface Props {
  onOpenChooseLanguage: () => void;
  onOpenNewAccount: () => void;
  onOpenExistingAccount: () => void;
}

class OnboardingAddAccountPage extends React.Component<Props> {
  handleNewAccountClicked = () => {
    this.props.onOpenNewAccount();
  }

  handleExistingAccountClicked = () => {
    this.props.onOpenExistingAccount();
  }

  handleChooseLanguageClicked = () => {
    this.props.onOpenChooseLanguage();
  }

  render() {
    return (
      <ModalPaper>
        <ModalPaperHeader>
          <FormattedMessage
            id="onboarding-add-account.title"
            description="Add account screen title"
            defaultMessage="RISE wallet"
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true} onClick={this.handleNewAccountClicked}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-add-account.new-account"
                  description="New account button title"
                  defaultMessage="New account"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-add-account.new-account-tip"
                  description="New account button tip"
                  defaultMessage="I want to create a new account on the RISE network"
                />
              )}
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true} onClick={this.handleExistingAccountClicked}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-add-account.existing-account"
                  description="Existing account button title"
                  defaultMessage="Existing account"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-add-account.existing-account-tip"
                  description="Existing account button tip"
                  defaultMessage="I want to access an existing account on the RISE network"
                />
              )}
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true} onClick={this.handleChooseLanguageClicked}>
            <FlagIcon countryCode="gb" />
            <ListItemText>
              <FormattedMessage
                id="onboarding-add-account.change-language"
                description="Change language button label"
                defaultMessage="Change language"
              />
            </ListItemText>
            <ChevronRight />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default OnboardingAddAccountPage;
