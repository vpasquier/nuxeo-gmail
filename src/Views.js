/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

function buildHomeCard() {
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl("https://media.glassdoor.com/sql/1066046/nuxeo-squarelogo-1516893998893.png")
      .setMultiline(true)
      .setTopLabel("Nuxeo presents")
      .setContent("<b>Nuxeo Gmail Inbox!</b>")
  );
  var sectionWelcome = CardService.newCardSection()
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.EMAIL)
        .setMultiline(true)
        .setContent("Push attachments from emails to Nuxeo")
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.MEMBERSHIP)
        .setMultiline(true)
        .setContent("Display information from Nuxeo links in email")
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.OFFER)
        .setMultiline(true)
        .setContent("Browse and attach any document to emails")
    );
  var sectionOAuthCreds = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("Please fill information to access Nuxeo:"))
    .addWidget(
      CardService.newTextInput()
        .setFieldName("nuxeoUrl")
        .setTitle("Nuxeo URL")
        .setHint("https://CLIENT.nuxeocloud.com/nuxeo")
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName("clientId")
        .setTitle("Client Id")
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName("clientSecret")
        .setTitle("Client Secret")
    )
    .addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText('<font color="#334CFF">Save Infos</font>')
          .setOnClickAction(CardService.newAction().setFunctionName("saveCreds"))
      )
    );
  var card = CardService.newCardBuilder()
    .addSection(sectionLogo)
    .addSection(sectionWelcome)
    .addSection(sectionOAuthCreds);
  return card.build();
}

/**
 * Builds the custom authorization card to connect to the user's Nuxeo
 * account.
 *
 *  @param {Object} opts Parameters for building the card
 * @param {string} opts.url - Authorization URL to redirect to.
 * @return {Card}
 */
function buildAuthorizationCard(opts) {
  var header = CardService.newCardHeader().setTitle("Authorization required");
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("Please authorize access to your Nuxeo account."))
    .addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText("Authorize")
          .setAuthorizationAction(CardService.newAuthorizationAction().setAuthorizationUrl(opts.url))
      )
    );
  var card = CardService.newCardBuilder()
    .setHeader(header)
    .addSection(section);
  return card.build();
}

/**
 * Creates a card for display error details.
 *
 * @param {Object} opts Parameters for building the card
 * @param {Error} opts.exception - Exception that caused the error
 * @param {string} opts.errorText - Error message to show
 * @param {boolean} opts.showStackTrace - True if full stack trace should be displayed
 * @return {Card}
 */
function buildErrorCard(opts) {
  var errorText = opts.errorText;

  if (opts.exception && !errorText) {
    errorText = opts.exception.toString();
  }

  if (!errorText) {
    errorText = "No additional information is available.";
  }

  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle("An unexpected error occurred"));
  card.addSection(
    CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(errorText))
      .addWidget(
        CardService.newButtonSet().addButton(
          CardService.newTextButton()
            .setText('<font color="#334CFF">Reset/Disconnect</font>')
            .setOnClickAction(CardService.newAction().setFunctionName("disconnect"))
        )
      )
      .addWidget(CardService.newTextParagraph().setText("(Refresh the page after clicking on the button)"))
  );

  if (opts.showStackTrace && opts.exception && opts.exception.stack) {
    var stack = opts.exception.stack.replace(/\n/g, "<br/>");
    card.addSection(
      CardService.newCardSection()
        .setHeader("Stack trace")
        .addWidget(CardService.newTextParagraph().setText(stack))
    );
  }
  return card.build();
}

/**
 * Creates an action that routes through the `dispatchAction` entry point.
 *
 * @param {string} name - Action handler name
 * @param {Object} opt_params - Additional parameters to pass through
 * @return {Action}
 * @private
 */
function createAction_(name, opt_params) {
  var params = _.extend({}, opt_params);
  params.action = name;
  return CardService.newAction()
    .setFunctionName("dispatchAction")
    .setParameters(params);
}

/**
 * Creates a link to an external URL.
 *
 * @param {string} url - URL to link to 
 * @return {OpenLink}
 * @private
 */
function createExternalLink_(url) {
  return CardService.newOpenLink()
    .setUrl(url)
    .setOpenAs(CardService.OpenAs.FULL_SIZE);
}

/**
 * Save oauth infos and trigger Auth.
 *
 * @param {event} event
 * @return {Card} the auth card 
 */
function saveCreds(event) {
  if (event) {
    var nuxeoUrl = getNuxeoURL();
    nuxeoUrl.nuxeoUrl = event.formInput.nuxeoUrl;
    putInCache(NUXEO_URL, nuxeoUrl);

    var credentials = getNuxeoCredentials();
    credentials.clientId = event.formInput.clientId;
    credentials.clientSecret = event.formInput.clientSecret;
    putInCache(CREDENTIALS_KEY, credentials);

    return handleAuthorizationRequired();
  }
}
