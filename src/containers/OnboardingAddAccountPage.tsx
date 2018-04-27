import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import LanguageIcon from '@material-ui/icons/Language';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';

interface Props {
  onOpenChooseLanguage: () => void;
  onOpenNewAccount: () => void;
}

class OnboardingAddAccountPage extends React.Component<Props> {
  handleNewAccountClicked = () => {
    this.props.onOpenNewAccount();
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
          <ListItem button={true}>
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
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
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
