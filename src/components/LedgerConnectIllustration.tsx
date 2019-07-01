import { Button } from '@material-ui/core';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/es/styles';
import React from 'react';

const styles = createStyles({
  root: {
    minWidth: 240,
    width: '100%'
  },
  '@keyframes ledgerConnect-usbCable': {
    '0%': { transform: 'translateX(-40px)' },
    '35%': { transform: 'translateX(0px)' }
  },
  '@keyframes ledgerConnect-homeScreen': {
    '0%': { opacity: 0 },
    '35%': { opacity: 0 },
    '40%': { opacity: 1 }
  },
  '@keyframes ledgerConnect-buttons': {
    '50%': { transform: 'translateY(0px)' },
    '60%': { transform: 'translateY(5px)' },
    '70%': { transform: 'translateY(0px)' }
  },
  usbCable: {
    animation: 'ledgerConnect-usbCable 5s linear infinite'
  },
  homeScreen: {
    animation: 'ledgerConnect-homeScreen 5s linear infinite'
  },
  leftButton: {
    animation: 'ledgerConnect-buttons 5s linear infinite'
  },
  rightButton: {
    animation: 'ledgerConnect-buttons 5s linear infinite'
  }
});

interface Props extends WithStyles<typeof styles> {
  onClick(): void;
}

const stylesDecorator = withStyles(styles, {
  name: 'LedgerConnectIllustration'
});

class LedgerConnectIllustration extends React.Component<Props> {
  render() {
    const { classes, onClick } = this.props;

    // Source SVG optimised with https://jakearchibald.github.io/svgomg/
    // and relevant animation groups injected by hand

    // tslint:disable:max-line-length
    return (
      <React.Fragment>
        <svg
          className={classes.root}
          height="90px"
          viewBox="160 55 240 90"
          aria-hidden={true}
        >
          <g fill="none" fillRule="evenodd">
            <g className={classes.usbCable}>
              <g transform="translate(-96 91)" fill="#2F2F2F" stroke="#434242">
                <path d="M.5 3.5h199v11H.5z" />
                <rect x="187.5" y=".5" width="29" height="17" rx="4" />
              </g>
              <g transform="translate(171 88)" fill="#D8D8D8" stroke="#979797">
                <rect x=".5" y=".5" width="24" height="23" rx="2" />
                <path d="M.5 3.5h24v17H.5z" />
              </g>
              <path
                d="M176 82.5h-60c-6.351 0-11.5 5.149-11.5 11.5v12c0 6.351 5.149 11.5 11.5 11.5h60a1.5 1.5 0 0 0 1.5-1.5V84a1.5 1.5 0 0 0-1.5-1.5z"
                stroke="#434242"
                fill="#2F2F2F"
              />
            </g>
            <rect
              fill="#4C575B"
              x="212"
              y="83"
              width="130"
              height="34"
              rx="1"
            />
            <g className={classes.homeScreen} fill="#A7CAED">
              <path d="M269.613 109.918h-.933V112h-1.172v-5.688h2.113c.672 0 1.19.15 1.555.45.364.3.547.722.547 1.27 0 .387-.084.71-.252.97-.168.26-.423.465-.764.62l1.23 2.323V112h-1.257l-1.067-2.082zm-.933-.95h.945c.294 0 .522-.074.684-.224.161-.15.242-.356.242-.619 0-.268-.076-.48-.229-.633-.152-.153-.386-.23-.7-.23h-.942v1.707zm6.094 3.032h-1.172v-5.688h1.172V112zm4.95-1.492c0-.222-.079-.391-.235-.51-.157-.118-.438-.243-.844-.375a5.981 5.981 0 0 1-.965-.389c-.646-.349-.969-.819-.969-1.41 0-.307.087-.581.26-.822.173-.24.422-.43.746-.565a2.808 2.808 0 0 1 1.092-.203c.406 0 .768.074 1.086.221.318.147.564.355.74.623.176.268.264.573.264.914h-1.172c0-.26-.082-.463-.246-.607-.164-.145-.395-.217-.691-.217-.287 0-.51.06-.668.182a.573.573 0 0 0-.239.478c0 .185.093.34.28.465.186.125.46.242.822.352.666.2 1.152.449 1.457.746.305.297.457.666.457 1.109 0 .492-.186.878-.559 1.158-.372.28-.873.42-1.504.42-.437 0-.836-.08-1.195-.24-.36-.16-.633-.38-.822-.658a1.686 1.686 0 0 1-.283-.97h1.175c0 .629.375.942 1.125.942.279 0 .496-.056.653-.17a.553.553 0 0 0 .234-.474zm6.304-.973h-2.25v1.524h2.64V112h-3.812v-5.687h3.805v.949h-2.633v1.355h2.25v.918zM274 87h6a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5zm0 3v2h2v-2h-2zm4 8v2h2v-2h-2zm0-7v1h1v-1h-1zm1-1v1h1v-1h-1zm-2 2v1h1v-1h-1zm2 0v1h1v-1h-1zm-1 1v1h1v-1h-1zm1 1v1h1v-1h-1zm-1 1v1h1v-1h-1zm-1-1v1h1v-1h-1zm-1-1v1h1v-1h-1zm-1 1v1h1v-1h-1zm1 1v1h1v-1h-1zm1 1v1h1v-1h-1zm-1 1v1h1v-1h-1zm-1-1v1h1v-1h-1zm-1-1v1h1v-1h-1zm0 2v1h1v-1h-1zm1 1v1h1v-1h-1zm-1 1v1h1v-1h-1z" />
            </g>
            <g className={classes.rightButton}>
              <rect
                stroke="#434242"
                strokeWidth="2"
                fill="#2F2F2F"
                x="331"
                y="62"
                width="18"
                height="8"
                rx="2"
              />
            </g>
            <g className={classes.leftButton}>
              <rect
                stroke="#434242"
                strokeWidth="2"
                fill="#2F2F2F"
                x="205"
                y="62"
                width="18"
                height="8"
                rx="2"
              />
            </g>
            <path
              d="M184 67a3 3 0 0 0-3 3v60a3 3 0 0 0 3 3h246a3 3 0 0 0 3-3V70a3 3 0 0 0-3-3H184zm30 16h126a2 2 0 0 1 2 2v30a2 2 0 0 1-2 2H214a2 2 0 0 1-2-2V85a2 2 0 0 1 2-2zm186 35c-9.941 0-18-8.059-18-18s8.059-18 18-18 18 8.059 18 18-8.059 18-18 18z"
              stroke="#434242"
              strokeWidth="2"
              fill="#2F2F2F"
            />
            <path
              d="M400 132h222a3 3 0 0 0 3-3V71a3 3 0 0 0-3-3H400c-17.673 0-32 14.327-32 32 0 17.673 14.327 32 32 32zm0-9c-12.703 0-23-10.297-23-23s10.297-23 23-23 23 10.297 23 23-10.297 23-23 23z"
              stroke="#AEAEAE"
              strokeWidth="2"
              fill="#C7C7C7"
            />
          </g>
        </svg>
        <Button onClick={onClick} color="secondary" fullWidth={true}>
          Discover Device
        </Button>
      </React.Fragment>
    );
    // tslint:enable:max-line-length
  }
}

export default stylesDecorator(LedgerConnectIllustration);
