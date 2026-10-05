const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const profiles = require('../src/data/electionProfiles.generated.json');
const presentation = require('../src/utils/electionPresentation.cjs');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:5173';
const screenshotDirectory = join(__dirname, '../node_modules/.cache/election-browser');



async function checkLayout(page)
{
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, 'Page must fit the viewport');
}



async function checkHome(page, language, width)
{
    await page.setViewportSize({ width, height: 900 });
    const exampleResponse = page.waitForResponse(response => response.url().includes('/brazil-2026/compare?') && response.status() === 200);
    await page.goto(website + (language === 'en' ? '/en' : '/'));
    await page.locator('.home-options').waitFor();
    assert.equal(await page.locator('.home-options > article').count(), 3);
    assert.equal(await page.locator('select').count(), 0);
    const boxes = await page.locator('.home-options > article').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    if (width > 880) assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 1));
    else assert.ok(boxes[0].y < boxes[1].y && boxes[1].y < boxes[2].y);
    for (const candidate of profiles.candidates)
    {
        const card = page.locator('.home-options [data-candidate="' + candidate.id + '"]');
        const expected = presentation.classificationLabels(candidate.scores, language);
        assert.equal(await card.locator('.ideology-header').getAttribute('data-family'), expected.family);
        assert.equal(await card.locator('.ideology-header h2').innerText(), expected.subtypeLabel);
        assert.ok(await card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0));
    }
    assert.equal(await page.locator('.political-family-card').count(), 5);
    assert.equal(await page.locator('.axis-explanation-card').count(), 12);
    for (const axis of profiles.axes[language])
    {
        const card = page.locator('.axis-explanation-card[data-axis="' + axis.id + '"]');
        assert.ok((await card.innerText()).includes(axis.label));
        assert.ok((await card.innerText()).includes(axis.leftPole));
        assert.ok((await card.innerText()).includes(axis.rightPole));
    }
    await page.locator('#exemplo .candidate-compatibility').first().waitFor();
    const example = await (await exampleResponse).json();
    assert.equal(example.scoringMethod, 'mean-absolute-distance-v1');
    assert.equal(example.axes.length, 12);
    for (const match of example.candidates)
    {
        const card = page.locator('#exemplo [data-candidate="' + match.id + '"]');
        assert.equal(await card.locator('.candidate-compatibility strong').innerText(), match.compatibility.toFixed(1) + '%');
        const family = await card.getAttribute('data-family');
        const indicatorColor = await page.locator('.political-family-card[data-family="' + family + '"] .family-indicator').evaluate(indicator => window.getComputedStyle(indicator).backgroundColor);
        const headerColor = await card.locator('.ideology-family').evaluate(label => window.getComputedStyle(label).color);
        assert.equal(headerColor, indicatorColor);
    }
    assert.equal(await page.locator('#example-profile .profile-axis').count(), 4);
    const spectrumBoxes = await page.locator('.political-family-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    if (width < 650) assert.ok(spectrumBoxes[1].y > spectrumBoxes[0].y);
    else assert.ok(Math.abs(spectrumBoxes[1].y - spectrumBoxes[0].y) < 1);
    const information = page.locator('.home-options .candidate-info-button').first();
    await information.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.ok(await dialog.locator('h3').innerText());
    const close = dialog.locator('button').first();
    await close.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'A');
    await page.keyboard.press('Tab');
    assert.ok(await close.evaluate(button => button === document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.ok(await information.evaluate(button => button === document.activeElement));
    await checkLayout(page);
    await page.screenshot({ path: join(screenshotDirectory, 'home-' + language + '-' + width + '.png'), fullPage: true });
}



async function checkResults(page, language, answer)
{
    await page.locator('.questionnaire-card button').click();
    await page.locator('input[value="short"]').check();
    await page.getByRole('button', { name: language === 'pt' ? 'Começar questionário' : 'Start questionnaire', exact: true }).click();
    for (let index = 0; index < 36; index += 1)
    {
        await page.locator('[data-answer="' + answer + '"]').click();
        if (index < 35) await page.getByRole('button', { name: language === 'pt' ? 'Próxima' : 'Next', exact: true }).click();
    }
    await page.getByRole('button', { name: language === 'pt' ? 'Comparar respostas' : 'Compare answers', exact: true }).click();
    await page.locator('#seu-perfil').waitFor();
    assert.equal(await page.locator('#seu-perfil .profile-axis').count(), 12);
    assert.equal(await page.locator('#seu-perfil .axis-explanation').count(), 12);
    assert.equal(await page.locator('.comparison-axis').count(), 12);
    assert.equal(await page.locator('.comparison-marker').count(), 36);
    assert.equal(await page.locator('.candidate-compatibility').count(), 2);
    const percentages = await page.locator('#seu-perfil .axis-pole-labels').allTextContents();
    for (const label of percentages)
    {
        const values = [...label.matchAll(/(\d+)%/g)].map(match => Number(match[1]));
        assert.equal(values[0] + values[1], 100);
    }
    if (answer === 'NEUTRAL')
    {
        assert.equal(await page.locator('#seu-perfil .ideology-header').getAttribute('data-family'), 'centre');
        assert.equal(await page.locator('#seu-perfil .ideology-header').getAttribute('data-subtype'), 'balanced-centrism');
    }
    await checkLayout(page);
    await page.screenshot({ path: join(screenshotDirectory, 'results-' + language + '-' + page.viewportSize().width + '.png'), fullPage: true });
}



async function checkCandidatePages(page, language)
{
    for (const candidate of profiles.candidates)
    {
        await page.goto(website + (language === 'en' ? '/en' : '') + '/candidatos/' + candidate.id);
        await page.locator('.candidate-page-header').waitFor();
        const expected = presentation.classificationLabels(candidate.scores, language);
        assert.equal(await page.locator('.ideology-header').getAttribute('data-family'), expected.family);
        assert.equal(await page.locator('.ideology-header h2').innerText(), expected.subtypeLabel);
        assert.equal(await page.locator('.axis-profile .profile-axis').count(), 12);
        assert.equal(await page.locator('tbody tr').count(), 12);
        assert.ok(await page.locator('.portrait').evaluate(image => image.complete && image.naturalWidth > 0));
        assert.ok((await page.locator('.running-mate').innerText()).includes(candidate.runningMate.name));
        assert.ok(await page.locator('tbody a[href*="#page="]').count() > 0);
        await checkLayout(page);
        await page.screenshot({ path: join(screenshotDirectory, candidate.id + '-' + language + '-' + page.viewportSize().width + '.png'), fullPage: true });
    }
}



async function checkMissingPortrait(browser)
{
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route('**/fotos/**', route => route.abort());
    await page.goto(website);
    await page.locator('.home-options .portrait-fallback').first().waitFor();
    assert.equal(await page.locator('.home-options .portrait-fallback').count(), 2);
    await page.goto(website + '/candidatos/lula-da-silva');
    await page.locator('.static-portrait-fallback').waitFor({ state: 'visible' });
    await checkLayout(page);
    await context.close();
}



async function checkUnavailableExample(browser)
{
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route('**/brazil-2026/compare?*', route => route.abort());
    await page.goto(website);
    const retry = page.locator('#exemplo button');
    await retry.waitFor();
    assert.equal(await page.locator('#exemplo .candidate-compatibility').count(), 0);
    assert.equal(await page.locator('#example-profile .profile-axis').count(), 4);
    await page.unroute('**/brazil-2026/compare?*');
    await retry.click();
    await page.locator('#exemplo .candidate-compatibility').first().waitFor();
    assert.equal(await page.locator('#exemplo .candidate-compatibility').count(), 2);
    await context.close();
}



async function main()
{
    mkdirSync(screenshotDirectory, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        for (const language of ['pt', 'en'])
        {
            for (const width of [1280, 768, 390])
            {
                const context = await browser.newContext();
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await checkHome(page, language, width);
                await checkResults(page, language, width === 1280 ? 'NEUTRAL' : 'STRONGLY_AGREE');
                await checkCandidatePages(page, language);
                assert.deepEqual(errors, []);
                await context.close();
                process.stdout.write(language + ' ' + width + ': home, quiz, user, comparisons and candidates passed.\n');
            }
        }
        await checkMissingPortrait(browser);
        process.stdout.write('Missing portrait fallbacks passed.\n');
        await checkUnavailableExample(browser);
        process.stdout.write('Unavailable example and retry passed.\n');
    }
    finally
    {
        await browser.close();
    }
}

main().catch(error =>
{
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
});
