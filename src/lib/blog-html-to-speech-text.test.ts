import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToSpeechText, splitSpeechTextForTts } from './blog-html-to-speech-text';

const SAMPLE_HTML = `
<p>Früher war eine professionelle Onepage-Website mit React ein erheblicher Budgetposten.</p>

<h2>Warum viele nach „KI Website erstellen“ suchen</h2>

<p>Wer nach <strong>KI Website erstellen</strong> sucht, will meist zwei Dinge wissen:</p>

<ol>
  <li>Ist das seriös – oder nur ein billiger Trick?</li>
  <li>Bekomme ich damit wirklich eine gute Website?</li>
</ol>

<table>
  <thead>
    <tr>
      <th>Lösung</th>
      <th>Stärken</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>WordPress</strong></td>
      <td>Weit verbreitet</td>
    </tr>
  </tbody>
</table>
`;

describe('htmlToSpeechText', () => {
  it('returns plain text without HTML tags', () => {
    const result = htmlToSpeechText({
      title: 'Website mit KI erstellen',
      excerpt: 'Was bedeutet Website mit KI erstellen wirklich?',
      html: SAMPLE_HTML,
    });

    assert.ok(!result.includes('<'), 'must not contain <');
    assert.ok(!result.includes('>'), 'must not contain >');
    assert.ok(!result.includes('<p>'), 'must not contain p tags');
    assert.ok(!result.includes('strong'), 'must not contain tag names');
    assert.ok(!result.includes('h2'), 'must not contain h2 tag name');

    assert.ok(result.startsWith('Website mit KI erstellen'));
    assert.ok(result.includes('Was bedeutet Website mit KI erstellen wirklich?'));
    assert.ok(result.includes('Warum viele nach'));
    assert.ok(result.includes('KI Website erstellen'));
    assert.ok(result.includes('Erstens:'));
    assert.ok(result.includes('Zweitens:'));
    assert.ok(result.includes('WordPress: Weit verbreitet'));
  });

  it('includes title and excerpt before body', () => {
    const result = htmlToSpeechText({
      title: 'Testtitel',
      excerpt: 'Kurzer Teaser.',
      html: '<p>Body-Text.</p>',
    });
    const titleIdx = result.indexOf('Testtitel');
    const excerptIdx = result.indexOf('Kurzer Teaser.');
    const bodyIdx = result.indexOf('Body-Text.');
    assert.ok(titleIdx < excerptIdx && excerptIdx < bodyIdx);
  });
});

describe('splitSpeechTextForTts', () => {
  it('keeps short text in one chunk', () => {
    const chunks = splitSpeechTextForTts('Kurzer Text.', 4000);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0], 'Kurzer Text.');
  });

  it('splits at paragraph boundaries', () => {
    const para = 'A'.repeat(2000);
    const text = `${para}\n\n${para}`;
    const chunks = splitSpeechTextForTts(text, 2500);
    assert.equal(chunks.length, 2);
  });
});
