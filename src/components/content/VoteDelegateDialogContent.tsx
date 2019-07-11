import Button from '@material-ui/core/es/Button';
import Grid from '@material-ui/core/es/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import TextField from '@material-ui/core/es/TextField';
import Typography from '@material-ui/core/es/Typography';
import { range } from 'lodash';
import React, { ReactEventHandler, ChangeEvent } from 'react';
import {
  FormattedMessage,
  defineMessages,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { Delegate } from 'risejs/dist/es5/types/beans';
import { RawAmount } from '../../utils/amounts';
import autoId from '../../utils/autoId';
import { formatAmount, FullDelegate } from '../../utils/utils';
import DelegateVoteComponent from '../DelegateVoteComponent';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    },
    searchTitle: {
      ...theme.typography.body2,
      color: theme.palette.text.secondary,
      fontWeight: 500
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'VoteDelegateDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'vote-delegate-dialog-content.dialog-title',
    description: 'Vote delegate name dialog title',
    defaultMessage: 'Vote for delegate'
  },
  instructions: {
    id: 'vote-delegate-dialog-content.instructions',
    description: 'Instructions before the delegate voting section',
    defaultMessage:
      'New blocks on the RISE blockchain are forged by the top 101 ' +
      'delegates. You as the user determine who those delegates are by ' +
      'casting a vote.'
  }
});

type SuggestionsContent = {
  kind: 'suggestions';
  delegates:
    FullDelegate[];
};

type ResultsContent = {
  kind: 'search-results';
  query: string;
  delegates:
    FullDelegate[];
};

type ErrorContent = {
  kind: 'insufficient-funds';
  onClose: ReactEventHandler<{}>;
};

type Content = SuggestionsContent | ResultsContent | ErrorContent;

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  query: string;
  onQueryChange: (query: string) => void;
  // TODO rename to onSubmit
  onSelect: (delegate: Delegate) => void;
  isLoading: boolean;
  votedDelegate: Delegate | null;
  voteFee: RawAmount;
  content: Content;
}

type DecoratedProps = Props & InjectedIntlProps;

class VoteDelegateDialogContent extends React.Component<DecoratedProps> {
  @autoId dialogContentId: string;

  handleQueryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const query = ev.target.value;
    const { onQueryChange, onFormChanged } = this.props;
    onQueryChange(query);
    onFormChanged(Boolean(query));
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const {
      intl,
      classes,
      query,
      onSelect,
      isLoading,
      votedDelegate,
      voteFee,
      content
    } = this.props;

    return (
      <Grid className={classes.content} container={true} spacing={16}>
        <Grid item={true} xs={12}>
          <Typography
            id={this.dialogContentId}
            children={intl.formatMessage(messages.instructions)}
          />
        </Grid>
        {content.kind === 'insufficient-funds' && (
          <>
            <Grid item={true} xs={12}>
              <Typography color="error">
                <FormattedMessage
                  id="vote-delegate-dialog-content.insufficient-funds-error"
                  description="Error about not having enough funds to vote for a delegate"
                  defaultMessage={
                    'You don\'t have enough funds in your account to pay the' +
                    ' network fee of {fee} for casting a vote for a delegate!'
                  }
                  values={{
                    fee: formatAmount(intl, voteFee)
                  }}
                />
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Button fullWidth={true} onClick={content.onClose}>
                <FormattedMessage
                  id="vote-delegate-dialog-content.close-button"
                  description="Label for close button."
                  defaultMessage="Close"
                />
              </Button>
            </Grid>
          </>
        )}
        {(content.kind === 'suggestions' ||
          content.kind === 'search-results') && (
          <>
            <Grid item={true} xs={12}>
              <TextField
                autoFocus={true}
                label={
                  <FormattedMessage
                    id="vote-delegate-dialog-content.search-box-label"
                    description="Delegate search box label"
                    defaultMessage="Find delegates by username or address"
                  />
                }
                value={query}
                fullWidth={true}
                onChange={this.handleQueryChange}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <Typography
                className={classes.searchTitle}
                align="left"
                component="p"
              >
                {content.kind === 'search-results' ? (
                  <FormattedMessage
                    id="vote-delegate-dialog-content.results-subtitle"
                    description="Title for search results"
                    defaultMessage={'Search results for "{query}"'}
                    values={{
                      query: content.query
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="vote-delegate-dialog-content.suggested-subtitle"
                    description="Title for suggested delegates"
                    defaultMessage="Suggested delegates"
                  />
                )}
              </Typography>
            </Grid>
            {range(3).map(n => {
              const delegate = content.delegates[n] || null;
              const hasVote =
                delegate && votedDelegate
                  ? delegate.forgingPK === votedDelegate.forgingPK
                  : false;
              return (
                <Grid
                  key={delegate ? delegate.address : `placeholder-${n}`}
                  item={true}
                  xs={12}
                >
                  <DelegateVoteComponent
                    delegate={delegate}
                    onSubmit={() => onSelect(delegate)}
                    hasVote={hasVote}
                    isLoading={isLoading}
                  />
                </Grid>
              );
            })}
          </>
        )}
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(VoteDelegateDialogContent));
