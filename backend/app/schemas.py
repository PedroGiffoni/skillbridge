import re
import unicodedata
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator


def normalize(value: str) -> str:
    value = unicodedata.normalize('NFKC', value)
    value = ''.join(c for c in value if not unicodedata.category(c).startswith('C') or c in '\n\t')
    return re.sub(r'\s+', ' ', value).strip()


class Model(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


Short = Annotated[str, StringConstraints(min_length=1, max_length=120)]
Text = Annotated[str, StringConstraints(min_length=1, max_length=800)]
Level = Annotated[int, Field(strict=True, ge=0, le=4)]


class Profile(Model):
    profession: str = Field(min_length=3, max_length=100)
    course: str = Field(default='', max_length=100)
    semester: int | None = Field(default=None, strict=True, ge=1, le=20)
    consent: bool = Field(strict=True)
    demo: bool = Field(default=False, strict=True)

    @field_validator('profession', 'course', mode='before')
    @classmethod
    def normalized(cls, value):
        return normalize(value) if isinstance(value, str) else value

    @field_validator('consent')
    @classmethod
    def consent_required(cls, value):
        if not value:
            raise ValueError('É necessário consentimento para processar a avaliação.')
        return value


class Competency(Model):
    id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,40}$')
    name: Short
    description: str = Field(min_length=1, max_length=300)
    question: str = Field(min_length=1, max_length=300)
    expected_level: Level


class QuestionnaireContent(Model):
    # Ambiguity is a valid response, not a license to invent a profession.
    clarification: str = Field(default='', max_length=300)
    competencies: list[Competency] = Field(max_length=8)

    @model_validator(mode='after')
    def valid_competencies(self):
        if self.clarification:
            if self.competencies:
                raise ValueError('Esclarecimento não pode conter competências.')
        elif not 5 <= len(self.competencies) <= 8:
            raise ValueError('Questionário deve conter entre 5 e 8 competências.')
        ids = [c.id for c in self.competencies]
        names = [normalize(c.name).casefold() for c in self.competencies]
        if len(set(ids)) != len(ids) or len(set(names)) != len(names):
            raise ValueError('Competências duplicadas.')
        return self


class Questionnaire(QuestionnaireContent):
    profession: str = Field(min_length=3, max_length=100)
    source_mode: Literal['gemini', 'demo']
    notice: Text
    token: str = Field(default='', max_length=24000)


class Answer(Model):
    competency_id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,40}$')
    self_level: Level
    example: str = Field(default='', max_length=300)

    @field_validator('example', mode='before')
    @classmethod
    def normalized(cls, value):
        return normalize(value) if isinstance(value, str) else value


class AssessmentRequest(Model):
    token: str = Field(min_length=1, max_length=24000)
    answers: list[Answer] = Field(min_length=5, max_length=8)
    consent: bool = Field(strict=True)
    demo: bool = Field(default=False, strict=True)

    @model_validator(mode='after')
    def valid_request(self):
        if not self.consent:
            raise ValueError('Consentimento obrigatório.')
        ids = [a.competency_id for a in self.answers]
        if len(set(ids)) != len(ids):
            raise ValueError('Respostas duplicadas.')
        return self


class Gap(Model):
    competency_id: str
    name: str
    expected_level: Level
    self_level: Level
    gap: Level


class Week(Model):
    week: int = Field(strict=True, ge=1, le=4)
    title: Short
    objective: Text
    actions: list[Text] = Field(min_length=1, max_length=4)
    deliverable: Text


class Guidance(Model):
    summary: Text
    strengths: list[Text] = Field(max_length=8)
    priorities: list[Text] = Field(max_length=8)
    weeks: list[Week] = Field(min_length=4, max_length=4)
    limitations: list[Text] = Field(min_length=1, max_length=5)

    @model_validator(mode='after')
    def four_weeks(self):
        if [w.week for w in self.weeks] != [1, 2, 3, 4]:
            raise ValueError('A trilha deve conter semanas 1, 2, 3 e 4 nessa ordem.')
        return self


class Assessment(Guidance):
    gaps: list[Gap]
    source_mode: Literal['gemini', 'demo']
    notice: Text
